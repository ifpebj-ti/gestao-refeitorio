# Política de segurança

Não publique vulnerabilidades, credenciais ou dados reais em issues públicas. Relate o problema
por um canal privado aos mantenedores do repositório, incluindo impacto, versão afetada e passos
mínimos para reprodução.

As verificações automatizadas incluem análise CodeQL, Dependency Review, detecção de segredos e
configurações inseguras, CVEs de dependências e varredura das imagens de container. Um alerta só
deve ser ignorado com justificativa documentada, prazo e responsável.

Credenciais nunca devem ser commitadas. Use GitHub Environment secrets na automação e o arquivo
`.env` protegido no host de destino. Em caso de exposição, revogue e rotacione a credencial antes
de remover o valor do histórico.
